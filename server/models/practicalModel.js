class Practical {
    constructor(id, video_link, user_creator, user_participants, user_instructors, comments, chats) {
        (this.id = id),
            (this.video_link = video_link),
            (this.user_creator = user_creator),
            (this.user_participants = user_participants),
            (this.user_instructors = user_instructors),
            (this.comments = comments),
            (this.chats = chats);
    }
}

export default Practical;