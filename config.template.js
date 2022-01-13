const config = {
    database: {
        postgresql: {
            host: 'localhost',
            port: 5432,
            database: 'telly_bot_db',
            user: 'telly_bot_db_user',
            password: 'telly_bot_db_pwd',
            timezone: '+08:00',
        },
    },
    github: {
        forwardIssueComment: {
            duration: 3600,
            task: [
                {
                    owner: 'github_repo_owner',
                    repo: 'github_repo_name',
                    issueNumber: 1,
                    issueUserId: undefined,
                    forwardChannelId: '@telegram_channel_id',
                    since: '2022-01-01T00:00:00.000Z',
                },
            ],
        },
    },
    pixiv: {
        randomGetCollection: {
            duration: 3600,
            path: ['pixiv_collection_path'],
        },
    },
}

module.exports = config
