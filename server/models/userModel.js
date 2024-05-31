class User {
    constructor(id, name, real_name, email, createdPracticals, inPracticals) {
        (this.id = id),
            (this.name = name),
            (this.real_name = real_name),
            (this.email = email),
            (this.createdPracticals = createdPracticals),
            (this.inPracticals = inPracticals);
    }
}

export default User;