module.exports = {
    apps: [
        {
            name: "whiteboard-file-server",
            exec_mode: "cluster",
            instances: "1",
            script: "./dist/server.node.js.map",
            args: "start",
            env: {
                PORT: 5001,
            },
        },
    ],
};