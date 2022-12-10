pushd ..
    ./bin/ts-unused-exports ./example/simple/tsconfig.json --exitWithUnusedTypesCount --excludePathsFromReport=to-ignore
    ERROR_COUNT=$?
    if [ $ERROR_COUNT -ne 2 ]
    then
        echo "[FAIL] Expected 2 issues, but got $ERROR_COUNT."
        exit 1
    else
        echo "[PASS]."
    fi
popd
