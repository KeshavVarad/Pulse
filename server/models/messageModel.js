class Message {
    constructor(id, username, real_name, timestamp, message) {
        (this.id = id),
            (this.username = username),
            (this.real_name = real_name),
            (this.timestamp = timestamp),
            (this.message = message);
    }
}

export default Message;