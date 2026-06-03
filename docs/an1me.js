module.exports = {
  getStreams: async (args) => {
    return [{
      name: "Test Stream",
      url: "https://example.com/video.mp4"
    }];
  }
};