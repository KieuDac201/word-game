import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/words",
        destination: "/games/falling-sentences",
        permanent: true,
      },
      {
        source: "/words/play",
        destination: "/games/falling-sentences/play",
        permanent: true,
      },
      {
        source: "/words/completion",
        destination: "/games/falling-sentences/result",
        permanent: true,
      },
      {
        source: "/scramble",
        destination: "/games/word-scramble",
        permanent: true,
      },
      {
        source: "/scramble/play",
        destination: "/games/word-scramble/play",
        permanent: true,
      },
      {
        source: "/scramble/completion",
        destination: "/games/word-scramble/result",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
