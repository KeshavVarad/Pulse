class Practical {
    constructor(id, practical_name, video_link, user_creator, user_participants, user_instructor_id, user_instructor_name, tasks, comments, chats) {
        (this.id = id),
            (this.practical_name = practical_name),
            (this.creation_date = Date.now()),
            (this.video_link = video_link),
            (this.user_creator = user_creator),
            (this.user_participants = user_participants),
            (this.user_instructor_id = user_instructor_id),
            (this.user_instructor_name = user_instructor_name),
            (this.tasks = tasks),
            (this.comments = comments),
            (this.chats = chats);
    }
}

export default Practical;