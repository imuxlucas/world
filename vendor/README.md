# Pinned build dependencies

These are unmodified npm distribution archives of the versions already used by this project:

- `@tencent/tad-universal-base` 1.0.5
- `@tencent/tad-universal-biz-ms` 1.36.4
- `@tencent/tad-universal-biz-mx` 1.61.0

Source: the `mirrors.tencent.com/npm/` tarball URLs recorded in the initial lockfile. Each archive was verified against that lockfile's SHA-512 integrity before inclusion. Integrity values are preserved in `package-lock.json`.

Each package declares MIT in its original `package.json`; package metadata and distribution contents are preserved without modification. Other fonts, images, and dependencies retain their respective rights. These archives exist so GitHub Actions can build without corporate network access. No credentials or `.npmrc` are required.

To upgrade, obtain the intended upstream archive, verify it, then update the three file dependencies and lockfile together. Do not replace an archive silently under the same version name.
