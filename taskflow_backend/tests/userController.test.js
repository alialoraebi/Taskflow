import { describe, expect, jest, beforeEach } from '@jest/globals';

const mockUserModel = {
  findOne: jest.fn(),
  create: jest.fn(),
  find: jest.fn(),
  findByIdAndDelete: jest.fn(),
  findByIdAndUpdate: jest.fn(),
};

const mockBcrypt = {
  hash: jest.fn(),
  compare: jest.fn(),
};

const mockJwt = {
  sign: jest.fn(),
};

jest.unstable_mockModule('../src/models/user.js', () => ({
  default: mockUserModel,
}));

jest.unstable_mockModule('bcryptjs', () => ({
  default: mockBcrypt,
}));

jest.unstable_mockModule('jsonwebtoken', () => ({
  default: mockJwt,
}));

const {
  registerUser,
  loginUser,
  getAllUsers,
  deleteUser,
  updateUser,
} = await import('../src/controllers/userController.js');

const mockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
  process.env.JWT_SECRET = 'test-secret';
  process.env.JWT_EXPIRES_IN = '1h';
});

describe('userController.registerUser', () => {
  it('returns 400 when required fields are missing', async () => {
    const req = { body: { username: 'john', email: '' } };
    const res = mockResponse();

    await registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Username, email, and password are required' });
  });

  it('returns 409 when username or email already exists', async () => {
    const req = { body: { username: 'john', email: 'john@example.com', password: 'secret' } };
    const res = mockResponse();

    mockUserModel.findOne.mockResolvedValue({ id: 'existing' });

    await registerUser(req, res);

    expect(mockUserModel.findOne).toHaveBeenCalledWith({ $or: [{ email: 'john@example.com' }, { username: 'john' }] });
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({ message: 'User with this email or username already exists' });
  });

  it('creates user and returns token on success', async () => {
    const req = {
      body: { username: 'john', email: 'john@example.com', password: 'secret', role: 'admin' },
    };
    const res = mockResponse();

    mockUserModel.findOne.mockResolvedValue(null);
    mockBcrypt.hash.mockResolvedValue('hashed-secret');
    const createdUser = { id: 'user123', role: 'admin' };
    mockUserModel.create.mockResolvedValue(createdUser);
    mockJwt.sign.mockReturnValue('signed-token');

    await registerUser(req, res);

    expect(mockBcrypt.hash).toHaveBeenCalledWith('secret', 10);
    expect(mockUserModel.create).toHaveBeenCalledWith({
      username: 'john',
      email: 'john@example.com',
      password: 'hashed-secret',
      role: 'admin',
    });
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ user: createdUser, token: 'signed-token' });
  });
});

describe('userController.loginUser', () => {
  it('rejects missing credentials', async () => {
    const req = { body: { username: '', password: '' } };
    const res = mockResponse();

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Username and password are required' });
  });

  it('rejects unknown user', async () => {
    const req = { body: { username: 'unknown', password: 'secret' } };
    const res = mockResponse();

    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    await loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid credentials' });
  });

  it('authenticates valid user and returns token', async () => {
    const req = { body: { username: 'john', password: 'secret' } };
    const res = mockResponse();

    const dbUser = {
      id: 'user123',
      role: 'admin',
      password: 'hashed',
      toJSON: jest.fn().mockReturnValue({ id: 'user123', role: 'admin' }),
    };

    mockUserModel.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(dbUser),
    });
    mockBcrypt.compare.mockResolvedValue(true);
    mockJwt.sign.mockReturnValue('signed-token');

    await loginUser(req, res);

    expect(mockBcrypt.compare).toHaveBeenCalledWith('secret', 'hashed');
    expect(dbUser.toJSON).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({ user: { id: 'user123', role: 'admin' }, token: 'signed-token' });
  });
});

describe('userController.getAllUsers', () => {
  it('returns list of users', async () => {
    const users = [{ id: '1' }, { id: '2' }];
    mockUserModel.find.mockResolvedValue(users);
    const req = {};
    const res = mockResponse();

    await getAllUsers(req, res);

    expect(mockUserModel.find).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith({ users });
  });
});

describe('userController.deleteUser', () => {
  it('returns 404 when user missing', async () => {
    mockUserModel.findByIdAndDelete.mockResolvedValue(null);
    const req = { params: { id: 'missing' }, user: { id: 'other' } };
    const res = mockResponse();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });

  it('deletes existing user', async () => {
    mockUserModel.findByIdAndDelete.mockResolvedValue({ id: 'user123' });
    const req = { params: { id: 'user123' }, user: { id: 'other' } };
    const res = mockResponse();

    await deleteUser(req, res);

    expect(res.json).toHaveBeenCalledWith({ message: 'User deleted successfully' });
  });

  it('returns 400 when user tries to delete own account', async () => {
    const req = { params: { id: 'user123' }, user: { id: 'user123' } };
    const res = mockResponse();

    await deleteUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own account' });
  });
});

describe('userController.updateUser', () => {
  it('hashes password when provided and returns updated user', async () => {
    mockBcrypt.hash.mockResolvedValue('hashed-secret');
    const updatedUser = { id: 'user123', username: 'Updated' };
    mockUserModel.findByIdAndUpdate.mockResolvedValue(updatedUser);

    const req = { params: { id: 'user123' }, body: { username: 'Updated', password: 'secret' } };
    const res = mockResponse();

    await updateUser(req, res);

    expect(mockBcrypt.hash).toHaveBeenCalledWith('secret', 10);
    expect(mockUserModel.findByIdAndUpdate).toHaveBeenCalledWith(
      'user123',
      { username: 'Updated', password: 'hashed-secret' },
      { new: true, runValidators: true },
    );
    expect(res.json).toHaveBeenCalledWith({ user: updatedUser });
  });

  it('returns 404 when user missing', async () => {
    mockUserModel.findByIdAndUpdate.mockResolvedValue(null);

    const req = { params: { id: 'missing' }, body: { username: 'Updated' } };
    const res = mockResponse();

    await updateUser(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ message: 'User not found' });
  });
});

