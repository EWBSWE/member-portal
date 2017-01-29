#!/bin/sh

mongo_export_csv() {
    NAME=$1
    mongoexport --db ewbmember --collection $NAME --type=csv --out $NAME.csv --fields $(head -n 1 20161205/$NAME.csv)
}

declare -a collections=(
    "eventaddons"
    "events"
    "payments"
    "producttypes"
    "users"
    "buyers"
    "eventparticipants"
    "members"
    "products"
    "settings"
)

for c in "${collections[@]}"
do
    echo $c
    mongo_export_csv $c
done

echo "done"
