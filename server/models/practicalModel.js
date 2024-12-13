class Practical {
    constructor(
        id,
        practical_name,
        creation_date,
        video_link,
        user_creator,
        user_participants,
        user_instructor_id,
        user_instructor_name,
        tasks,
        comments,
        chats,
        red_count,
        yellow_count,
        green_count,
        avg_rating,
        school_id,
        cohort_year,
        transcript_link,
        template
    ) {
        (this.id = id),
            (this.practical_name = practical_name),
            (this.creation_date = creation_date),
            (this.video_link = video_link),
            (this.user_creator = user_creator),
            (this.user_participants = user_participants),
            (this.user_instructor_id = user_instructor_id),
            (this.user_instructor_name = user_instructor_name),
            (this.tasks = tasks),
            (this.comments = comments),
            (this.chats = chats),
            (this.red_count = red_count),
            (this.yellow_count = yellow_count),
            (this.green_count = green_count),
            (this.avg_rating = avg_rating),
            (this.school_id = school_id),
            (this.cohort_year = cohort_year),
            (this.transcript_link = transcript_link),
            (this.template = template);
    }
}

export default Practical;