class School {
    constructor(id, school_name, practicals, students, instructors, admins, task_data, task_pool) {
        (this.id = id),
            (this.school_name = school_name),
            (this.practicals = practicals),
            (this.students = students),
            (this.instructors = instructors),
            (this.admins = admins),
            (this.task_data = task_data),
            (this.task_pool = task_pool)
    }
}

export default School;