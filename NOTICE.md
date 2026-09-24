# Third-party notices and attribution

## Cyber Gym is a modified work

Cyber Gym is a derivative work: it began from the source code of **openGym** — Copyright (C)
2026 Duarte Santos (<https://github.com/DuarteSantos8/openGym>) — and has since been
substantially modified: the product identity, the entire user-facing language (Russian), the
design system, the assets and parts of the API, the web client and the tooling have been
rewritten.

Cyber Gym as a whole is licensed under the **GNU Affero General Public License v3.0** (see
[LICENSE](LICENSE)), which the original work also used. The names and links above appear in
this notice only because attribution is a licence condition; they are not part of the product.

Corresponding source for this modified work:
<https://github.com/Kurubik/cyber-gym>

## App store exception (as granted by the original copyright holder)

As an additional permission under section 7 of the AGPL v3.0, the original copyright holder
permits distribution of the openGym mobile application through app store platforms (such as
the Apple App Store and Google Play) whose terms of service would otherwise be incompatible
with the AGPL, provided the corresponding source code remains available under the AGPL at the
project repository. This permission applies to the distribution channel only and does not
otherwise limit the license.

## Body diagram geometry

The muscle outlines the body maps are drawn from (`frontend/src/lib/body-paths.js`) are derived
from [**MuscleMap**](https://github.com/melihcolpan/MuscleMap) by Melih Colpan, used under the
**MIT License** and reproduced below. MuscleMap ships its path data as Swift source rather than
`.svg` files; the paths were converted to a JSON module, its sub-group shapes were dropped, and
nothing else about the artwork was changed.

```
MIT License

Copyright (c) 2026 Melih Colpan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Exercise data & media

Exercise metadata and media reach this project through
[**hasaneyldrm/exercises-dataset**](https://github.com/hasaneyldrm/exercises-dataset), which
licenses them differently from the application code. Neither is covered by Cyber Gym's AGPL.

That dataset is itself a redistribution: the content originates from
[**ExerciseDB v1**](https://exercisedb.dev/) by **AscendAPI**. This is verifiable from the data
itself — the stored media filenames embed ExerciseDB's `exerciseId` (`0001` is
`0001-2gPfomN.jpg`; `2gPfomN` is ExerciseDB's id for "3/4 sit-up"), every metadata field
matches, and the instruction sentences are identical apart from stripped `Step:N ` prefixes.

### Metadata & instruction text

The exercise names, attributes and instructions originate from ExerciseDB v1 and arrive through
the dataset above, which distributes them under the MIT license reproduced below. Translations
into languages other than English are derivative works of the respective contributors to the
upstream project and remain under the AGPL.

```
MIT License

Copyright (c) 2026 Hasan Emir Yıldırım

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation and data files (the "Software"),
to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
sell copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Images & animations — third-party, not MIT and not AGPL

The exercise thumbnails (180×180) and animations are **not** covered by the MIT license above
and **not** by Cyber Gym's AGPL. Their ownership is unresolved upstream, and this notice says
so plainly rather than guessing:

- The dataset attributes them to **© [Gym visual](https://gymvisual.com/)**, redistributed there
  with that rights holder's written permission — a permission granted to *that dataset* and
  **not transferable**.
- **ExerciseDB/AscendAPI** describes itself as the original creator and owner of this content
  and publishes its own [terms](https://exercisedb.io/faq), which permit self-hosting, bundling
  and commercial display while prohibiting redistribution of the raw dataset or media as a
  standalone or competing content package.

These two claims contradict each other upstream. **Until that is settled, treat the media as
third-party content licensed to neither this project nor to you.**

**Neither Cyber Gym nor its history redistributes it.** It is not in this repository, not in
its Git history and not in the published container images or the Android APK. A self-hosted
instance downloads it from the upstream source on first `docker compose up`; the mobile and
demo builds load it from a CDN at runtime.

If you want to reuse the media, commercially or not, **clear it with the rights holder first**
and keep any attribution that accompanies it intact.

## Gym check-in QR codes

The gym check-in feature (a saved membership code shown as a QR code on the phone, added by
typing, importing a photo, or scanning with the camera) uses three third-party packages. All
are permissively licensed and compatible with the AGPL, and all load on demand: the QR renderer
and the browser decoder only when a card is shown or scanned, the ML Kit plugin only in the
Android/iOS app.

### QR/barcode rendering — `lean-qr`

Rendered with [**lean-qr**](https://github.com/davidje13/lean-qr) by David Evans, under the
**MIT License**, reproduced below. Only the code's stored value is kept; the picture is
generated fresh from that value each time it is shown and is never stored.

```
MIT License

Copyright (c) 2021-2025 David Evans

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### Camera scan & photo decode in the browser — `jsQR`

Reads codes from the camera or an imported photo using
[**jsQR**](https://github.com/cozmo/jsQR) by Cosmo Wolfe, under the **Apache License 2.0**
(text at <https://www.apache.org/licenses/LICENSE-2.0> and in the package's own `LICENSE`).
Where the browser has a native `BarcodeDetector`, that is tried first and jsQR is the fallback.
Video frames are decoded in memory and are never uploaded or stored.

### Camera scan & photo decode in the app — `@capacitor-mlkit/barcode-scanning`

In the Android/iOS app, reading a code uses the
[**@capacitor-mlkit/barcode-scanning**](https://github.com/capawesome-team/capacitor-mlkit)
plugin by the Capawesome Team (Robin Genz), a Capacitor wrapper around Google's ML Kit, under
the **Apache License 2.0**. Only the decoded string is kept; the photo itself is never stored.

## Fonts

The Blackwall typography is self-hosted (`frontend/src/assets/fonts/`), both under the
**SIL Open Font License 1.1**:

- **IBM Plex Sans** — © IBM Corp. License text: `frontend/src/assets/fonts/OFL-ibmplexsans.txt`.
- **JetBrains Mono** — © JetBrains s.r.o. License text:
  `frontend/src/assets/fonts/OFL-jetbrainsmono.txt`.

The files in this repository are the Google Fonts `latin` and `cyrillic` subsets served as
`.woff2`.
