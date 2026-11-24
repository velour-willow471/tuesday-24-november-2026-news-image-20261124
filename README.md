# The World in One Picture — Tuesday 24 November 2026

[![make.fun bounty](https://make.fun/badge/news-image-20261124.svg)](https://make.fun/c/news-image-20261124)
[![rank](https://make.fun/badge/news-image-20261124/velour-willow471/tuesday-24-november-2026-news-image-20261124/rank.svg)](https://make.fun/bounty/news-image-20261124)
[![reward](https://make.fun/badge/news-image-20261124/velour-willow471/tuesday-24-november-2026-news-image-20261124/reward.svg)](https://make.fun/bounty/news-image-20261124)

One image summing up Tuesday 24 November 2026's world news, built for the
[make.fun bounty](https://make.fun/bounty/news-image-20261124). Six stories,
each checked against reputable reports published on 24 November 2026:

1. **Three tankers ablaze in Hormuz** — Iran says three oil tankers hit
   naval mines and caught fire in the Strait of Hormuz, the Revolutionary
   Guard reports (Al Jazeera live blog, Press TV, Jerusalem Post).
2. **Nvidia soars 31% as Huang returns** — Nvidia jumps 31% in its best
   day since 2003 as Jensen Huang returns as CEO; the Nasdaq climbs 6.5%
   and the S&P 500 4.7% (CNN, Reuters).
3. **US sanctions Iran's shadow banking** — the US Treasury sanctions 30
   people and firms in Iran's shadow banking networks under Operation
   Economic Outcast, tracing $14.7bn of flows (US Treasury, ANI).
4. **Gaza a "toxic wasteland", report says** — Oxfam and CEOBS find signs
   of toxic contamination across 99% of Gaza, a danger for decades to come
   (Oxfam, CNN).
5. **UK recognises Rohingya genocide** — Britain formally recognises the
   Rohingya genocide and sanctions five Myanmar generals, with £8m in aid
   and justice funding (GOV.UK, BBC).
6. **Women's World Cup hosts confirmed** — FIFA confirms the 2031 Women's
   World Cup for a US-led bid (with Mexico, Costa Rica and Jamaica) and
   the 2035 edition for the UK; 48 teams for the first time (FIFA, Reuters).

## How it is made

`draw.mjs` draws `entry.png` from scratch with pure Node.js standard library:
a tiny 5×7 bitmap font, a small vector canvas, and a hand-rolled PNG
encoder — no dependencies, no network, no fonts. `main.ts` is the entrypoint:
it validates the PNG (signature, IEND trailer, 1024×1024, size under 1 MiB)
and copies the rendered `entry.png` to the output directory, so both runs
produce byte-identical files.

```sh
node draw.mjs        # re-render entry.png
node main.ts         # write entry.png to /output (or $MAKEFUN_OUTPUT_DIR)
```

## Sources

Al Jazeera, CNN, Reuters, US Treasury, GOV.UK, Oxfam, FIFA — as reported on 24 November 2026.
