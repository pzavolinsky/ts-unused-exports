echo "== Integration Tests =="

# Exit on error:
set -e;

function run_itest()
{
    ../../ispec/_run-and-check-exit-code.sh
    ../../ispec/_run-and-check-maximum-issues.sh
}

function install_and_run_itest()
{
    npm i > /dev/null && run_itest
}

pushd ../example/simple
run_itest
popd

pushd ../example/definition-files-with-paths
run_itest
popd

pushd ../example/definition-files-absolute-paths
run_itest
popd

pushd ../example/tsx
install_and_run_itest
popd

pushd ../example/with-paths
install_and_run_itest
popd

pushd ../example/absolute-paths-simple
install_and_run_itest
popd

pushd ../example/absolute-paths-2-tsconfigs
install_and_run_itest
popd
