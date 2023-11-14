# Fanout WebSockets Demo for Fastly Compute: Pushpin on Docker

This directory contains a `package.json` file with scripts that allow you to easily run an instance of Pushpin,
suitably configured for use with the Fanout WebSockets Demo for Fastly Compute.

## Setup

Make sure you're running Docker Desktop.

```shell
pnpm pull
```

This will obtain the newest release of Pushpin.

## Starting Pushpin

Make sure that local ports 5560-5563 and 7999 are free. Then type the following:

```shell
pnpm start
```

Pushpin will run, and its logs will be printed to stdout.

## Stopping Pushpin

Press `Ctrl+C` to stop Pushpin.
