class Notification {
    constructor(id, task, user_id, message, timestamp, read_status, practical_id) {
        (this.id = id),
            (this.task = task),
            (this.user_id = user_id),
            (this.message = message),
            (this.timestamp = timestamp),
            (this.read_status = read_status),
            (this.practical_id = practical_id);
    }
}

export default Notification;