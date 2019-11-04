echo "== Integration Tests =="

# Exit on error:
set -e;

pushd ../example/simple
../../ispec/_run-and-check-exit-code.sh
popd

pushd ../example/tsx
npm i > /dev/null && ../../ispec/_run-and-check-exit-code.sh
popd

pushd ../example/with-paths
npm i > /dev/null && ../../ispec/_run-and-check-exit-code.sh
popd
