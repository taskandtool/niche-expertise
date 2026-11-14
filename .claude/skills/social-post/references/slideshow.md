# Slideshows and carousels

Read when the post is a TikTok slideshow (photo mode) or an Instagram or
LinkedIn carousel. Each platform takes the slides as separate images and
plays them itself. There is no video to render.

## The slides

- **Slide 1 is the hook**: the promise of the whole set in at most eight
  words ("5 signs you need one system"). Most people decide here.
- **One point per slide**, at most twelve words, big enough to read on a
  phone. Five to eight slides; the last one says what to do next ("Save
  this", "Follow for part 2").
- **One look across the set**: write the style once in the folder's
  `anchor.md` and put it in every slide's prompt. Slide 1 is the reference
  for the rest.
- **Sizes**: 9:16 for TikTok, 4:5 for Instagram, 1:1 or 4:5 for LinkedIn.

## Making them

Start from the owner's photos: a slide can be their photo with the line set
on it (an edit of the photo). Otherwise `make-image` sets the line in the
picture. Number the slides in order. Each has a `slide-N.md` with its prompt
under a `## Prompt` heading, and a `slide-N.jpg` made from it
(`--prompt-file slide-N.md --section Prompt`). Pass `--ref slide-1.jpg` for
every slide after the first. Put the caption and hashtags in `creative.md`
as for any post, and list every `slide-N.jpg` in its `files`. Read every
slide at full size for misspelt words before the owner sees the set.
