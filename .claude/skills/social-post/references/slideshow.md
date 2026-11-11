# Slideshows and carousels

Read when the post is a TikTok slideshow (photo mode) or an Instagram or
LinkedIn carousel. Each platform takes the slides as separate images and
plays them itself, so there is no video to render.

## The slides

- **Slide 1 is the hook**: the promise of the whole set in at most eight
  words ("5 signs you need one system"). Most people decide here.
- **One point per slide**, at most twelve words, big enough to read on a
  phone. Five to eight slides; the last one says what to do next ("Save
  this", "Follow for part 2").
- **One look across the set**: write the style once in the folder's
  `anchor.md` and put it in every slide's prompt, with slide 1 as the
  reference for the rest, so the set reads as one post.
- **Sizes**: 9:16 for TikTok, 4:5 for Instagram, 1:1 or 4:5 for LinkedIn.

## Making them

The owner's photos first: a slide may be their photo with the line set on
it (an edit of the photo). Otherwise `make-image` sets the line in the
picture. Each slide gets a `slide-N.md` with its prompt under a `## Prompt`
heading, and the `slide-N.jpg` made from it (`--prompt-file slide-N.md
--section Prompt`),
numbered in order; every slide after the first passes `--ref slide-1.jpg`.
The caption
and hashtags go in `creative.md` as for any post, and its `files` lists
every `slide-N.jpg`. Read every slide at full size for
misspelt words before the owner sees the set.
