module.exports = {
    apps: [
        {
            name: "whiteboard-multisync-server",
            exec_mode: "cluster",
            instances: "1",
            script: "./dist/server.node.js",
            args: "start",
            env: {
                PORT: 5101,
            },
        },
    ],
};