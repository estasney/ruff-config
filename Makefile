ASSETS := src/assets
VERSION_TARGETS := version-patch version-minor version-major

.PHONY: assets build check-clean $(VERSION_TARGETS)

# Regenerate the three ruff data assets from the installed ruff.
assets:
	ruff rule --all --output-format json > $(ASSETS)/ruffRules.json
	ruff linter --output-format json > $(ASSETS)/ruffLinters.json
	ruff version --output-format json | jq '{version}' > $(ASSETS)/ruffVersion.json
	git add src/assets

# Type-check and build the single-file page into docs/.
build:
	npm run build

check-clean:
	@test -z "$$(git status --porcelain)" || { echo "Git tree is dirty."; exit 1; }

# Bump package.json + package-lock.json, commit only those two files as
# "vX.Y.Z", and create an annotated tag vX.Y.Z noting the bundled ruff data.
$(VERSION_TARGETS): version-%: check-clean
	@NEW_VERSION=$$(npm version $* --no-git-tag-version) && \
	git add package.json package-lock.json && \
	git commit -q -m "$$NEW_VERSION" && \
	git tag -a "$$NEW_VERSION" -m "$$NEW_VERSION" -m "ruff data: $$(jq -r .version $(ASSETS)/ruffVersion.json)"