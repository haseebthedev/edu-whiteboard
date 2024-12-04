module.exports = {
    apps: [
        {
            name: "whiteboard-file-server",
            exec_mode: "cluster",
            instances: "1",
            script: "./dist/main.js",
            args: "start",
            env: {
                PORT: process.env.PORT,
            },
        },
    ],
};
