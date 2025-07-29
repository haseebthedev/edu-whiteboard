module.exports = {
    apps: [
        {
            name: "whiteboard-file-server",
            exec_mode: "cluster",
            instances: "1",
            script: "./dist/server.node.js",
            args: "start",
            env: {
                PORT: 5100,
            },
        },
    ],
};