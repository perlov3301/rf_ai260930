I've been building a browser-based tool for synthesizing multi-step RF impedance transformers, aimed at UHF antenna matching and combined bandpass/bandstop filter design.

Each section is built from two transmission-line strips — one in series toward the load, one shorted stub to ground — cascaded so each step's input impedance becomes the load for the next. The synthesis engine runs in two phases: a randomized search over strip lengths/impedances, followed by a genetic algorithm that refines candidates against target VSWR/return-loss specs. You give it two frequency sets — one for passband (low VSWR) and one for stopband (high rejection) — and it optimizes both simultaneously.

This is a from-scratch JS rewrite of an approach I originally implemented in Pascal in the late 80s/early 90s as an antenna engineer, back when this kind of synthesis meant overnight batch runs. Curious what HN thinks of the random search + genetic-optimization approach vs. more traditional analytical stepped-impedance filter synthesis and whether there's interest in extending it toward lossy-line modeling or Smith-chart visualization.

Feedback and PRs welcome .
https://perlov3301.github.io/fn_lr_delta260726/