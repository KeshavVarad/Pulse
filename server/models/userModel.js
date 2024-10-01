class User {
    constructor(id,
        username,
        real_name,
        email,
        createdPracticals,
        inPracticals,
        teachPracticals,
        navigation_tutorial,
        dashboard_tutorial,
        make_practical_tutorial,
        role,
        school_name,
        school_id,
        grad_year,
        shortcuts,
        task_pool
    ) {
        (this.id = id),
            (this.username = username),
            (this.real_name = real_name),
            (this.email = email),
            (this.createdPracticals = createdPracticals),
            (this.teachPracticals = teachPracticals),
            (this.inPracticals = inPracticals),
            (this.navigation_tutorial = navigation_tutorial),
            (this.dashboard_tutorial = dashboard_tutorial),
            (this.make_practical_tutorial = make_practical_tutorial),
            (this.role = role),
            (this.school_name = school_name),
            (this.school_id = school_id),
            (this.grad_year = grad_year),
            (this.shortcuts = shortcuts),
            (this.task_pool = task_pool);
    }
}

export default User;