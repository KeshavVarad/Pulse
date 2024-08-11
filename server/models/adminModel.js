class Admin {
    constructor(id, username, school_name, email, createdPracticals, students, instructors) {
        (this.id = id),
            (this.username = username),
            (this.school_name = school_name),
            (this.email = email),
            (this.createdPracticals = createdPracticals),
            (this.students = students),
            (this.instructors = instructors)
    }
}

export default Admin;