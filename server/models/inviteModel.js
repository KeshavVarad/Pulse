class Invite {
    constructor(id, school_name, school_id, invite_email, role, status, expires_on) {
        (this.id = id),
            (this.school_name = school_name),
            (this.school_id = school_id),
            (this.invite_email = invite_email),
            (this.role = role),
            (this.status = status),
            (this.expires_on = expires_on)
    }
}

export default Invite;