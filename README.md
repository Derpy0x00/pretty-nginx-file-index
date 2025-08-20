# pretty-nginx-file-index

## End-to-end testing

Run the setup script once to install test dependencies (requires a Debian-based host and root privileges for package installs):

```
./scripts/setup-test-env.sh
```

After setup, execute the end-to-end ZIP download test:

```
npm run test:e2e
```

The test spins up a temporary Nginx instance serving sample files, triggers the "Download ZIP" button via Playwright, and verifies the archive contents.
