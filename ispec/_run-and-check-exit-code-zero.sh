# continue on error
set +e;

function run {
    node ../../bin/ts-unused-exports tsconfig.json --exitWithUnusedTypesCount --excludePathsFromReport=to-ignore $1
    ERROR_COUNT=$?
    if [ $ERROR_COUNT -ne 0 ]
    then
        echo "[FAIL] Expected 0 issues, but got $ERROR_COUNT."
        exit 1
    else
        echo "[PASS]."
    fi
}

run
run --showLineNumber
run --silent
