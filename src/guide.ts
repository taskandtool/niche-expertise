// A guide's markdown as HTML. An AI wrote it after reading crawled text, so raw HTML, pictures and any link that isn't web, mail, phone or this site go.
import { Marked } from "marked";

const guide = new Marked({
  renderer: {
    html: () => "",
    image: () => "",
    link(token) {
      return /^(https?:|mailto:|tel:|\/(?!\/)|#)/i.test(token.href) ? false : this.parser.parseInline(token.tokens);
    },
  },
});

export const guideHtml = (text: string) => guide.parse(text, { async: false });
