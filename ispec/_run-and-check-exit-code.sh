# continue on error
set +e;

function run {
    node ../../bin/ts-unused-exports tsconfig.json --exitWithUnusedTypesCount --excludePathsFromReport=to-ignore $1 $2
    ERROR_COUNT=$?
    if [ $ERROR_COUNT -ne 2 ]
    then
        echo "[FAIL] Expected 2 issues, but got $ERROR_COUNT."
        exit 1
    else
        echo "[PASS]."
    fi
}

run $1
run --showLineNumber $1
