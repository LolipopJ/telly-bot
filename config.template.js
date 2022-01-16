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
            enable: false,
            duration: 3600, // 1 hour
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
        generateCollectionIndex: {
            enable: false,
            duration: 3600, // 1 hour
            path: ['path/to/pixiv_collection'],
        },
    },
    hexo: {
        forwardHexoBlog: {
            enable: false,
            duration: 28800, // 8 hour
            task: [
                {
                    path: 'path/to/source/_posts',
                    baseUrl: 'https://your_username.github.io',
                    // permalink: ':year/:month/:day/', // Only support this permalink
                    offsetDay: 0, // ':day' in permalink will be as ':day + offsetDay'
                    forwardChannelId: '@telegram_channel_id',
                    since: '2022-01-01T00:00:00.000Z', // Since created date of blog
                },
            ],
        },
    },
}

module.exports = config
