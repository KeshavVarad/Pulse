class Comment {
    constructor(id, task, timestamp, rating, feedback, replies) {
        (this.id = id),
            (this.task = task),
            (this.timestamp = timestamp),
            (this.rating = rating),
            (this.feedback = feedback),
            (this.replies = replies);
    }
}

export default Comment;