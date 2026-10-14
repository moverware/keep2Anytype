export const convertMicrosecondsToSeconds = (microseconds: number) => {
  return Math.floor(microseconds / 1000000);
};

interface UrlMatch {
  url: string;
  start: number;
  end: number;
}

export const extractUrls = (input: string): UrlMatch[] => {
  return [...input.matchAll(/https?:\/\/[^\s]+/g)].map((match) => ({
    url: match[0],
    start: match.index,
    end: match.index + match[0].length,
  }));
};
