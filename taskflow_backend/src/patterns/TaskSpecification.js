class TaskSpecification {
  and(otherSpecification) {
    return new AndSpecification(this, otherSpecification);
  }

  or(otherSpecification) {
    return new OrSpecification(this, otherSpecification);
  }

  not() {
    return new NotSpecification(this);
  }

  toQuery() {
    return {};
  }
}

class StatusSpecification extends TaskSpecification {
  constructor(status) {
    super();
    this.status = status;
  }

  toQuery() {
    return this.status ? { status: this.status } : {};
  }
}

class PrioritySpecification extends TaskSpecification {
  constructor(priority) {
    super();
    this.priority = priority;
  }

  toQuery() {
    return this.priority ? { priority: this.priority } : {};
  }
}

class ProjectSpecification extends TaskSpecification {
  constructor(projectId) {
    super();
    this.projectId = projectId;
  }

  toQuery() {
    return this.projectId ? { projectId: this.projectId } : {};
  }
}

class DueBeforeSpecification extends TaskSpecification {
  constructor(date) {
    super();
    this.date = date;
  }

  toQuery() {
    return this.date ? { dueDate: { $lte: this.date } } : {};
  }
}

class DueAfterSpecification extends TaskSpecification {
  constructor(date) {
    super();
    this.date = date;
  }

  toQuery() {
    return this.date ? { dueDate: { $gte: this.date } } : {};
  }
}

class AndSpecification extends TaskSpecification {
  constructor(leftSpecification, rightSpecification) {
    super();
    this.leftSpecification = leftSpecification;
    this.rightSpecification = rightSpecification;
  }

  toQuery() {
    return {
      $and: [
        this.leftSpecification.toQuery(),
        this.rightSpecification.toQuery(),
      ],
    };
  }
}

class OrSpecification extends TaskSpecification {
  constructor(leftSpecification, rightSpecification) {
    super();
    this.leftSpecification = leftSpecification;
    this.rightSpecification = rightSpecification;
  }

  toQuery() {
    return {
      $or: [
        this.leftSpecification.toQuery(),
        this.rightSpecification.toQuery(),
      ],
    };
  }
}

class NotSpecification extends TaskSpecification {
  constructor(specification) {
    super();
    this.specification = specification;
  }

  toQuery() {
    return {
      $nor: [this.specification.toQuery()],
    };
  }
}

const buildTaskQuery = ({ projectId, status, priority, dueBefore, dueAfter } = {}) => {
  const specifications = [
    new ProjectSpecification(projectId),
    new StatusSpecification(status),
    new PrioritySpecification(priority),
    new DueBeforeSpecification(dueBefore),
    new DueAfterSpecification(dueAfter),
  ].map((specification) => specification.toQuery());

  const activeSpecifications = specifications.filter((query) => Object.keys(query).length > 0);

  if (activeSpecifications.length === 0) {
    return {};
  }

  if (activeSpecifications.length === 1) {
    return activeSpecifications[0];
  }

  return { $and: activeSpecifications };
};

export {
  TaskSpecification,
  StatusSpecification,
  PrioritySpecification,
  ProjectSpecification,
  DueBeforeSpecification,
  DueAfterSpecification,
  AndSpecification,
  OrSpecification,
  NotSpecification,
  buildTaskQuery,
};
