class User {
    constructor(id, username, real_name, email, createdPracticals, inPracticals, teachPracticals) {
        (this.id = id),
            (this.username = username),
            (this.real_name = real_name),
            (this.email = email),
            (this.createdPracticals = createdPracticals),
            (this.teachPracticals = teachPracticals),
            (this.inPracticals = inPracticals);
    }
}

export default User;