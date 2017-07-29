#!/bin/bash

if [ "$CONCURRENCY" != "" ]; then
  CONCURRENY="-c $CONCURRENY"
fi

if [ "$SKIP" != "" ]; then
  SKIP="-i $SKIP"
fi

if [ "$USE_TARGET_API" != "" ]; then
  USE_TARGET_API="-a"
fi

if [ "$VERBOSE" != "" ]; then
  VERBOSE="-v"
fi

if [ "$RUN_EVERY_SECS" != "" ]; then
  continuous=1
fi

loop=true

while [ $loop ]; do

  before=`date +"%s"`

  /usr/local/bin/replicate-couchdb-cluster -s $SOURCE -t $TARGET $CONCURRENY $SKIP $USE_TARGET_API $VERBOSE

  after=`date +"%s"`

  if [ "$continuous" == "1" ]; then
    duration=`expr $after - $before`

    # Do we need to sleep?
    if [ $RUN_EVERY_SECS -gt $duration ]; then
      timeLeft=`expr $RUN_EVERY_SECS - $duration`

      if [ "$VERBOSE" != "" ]; then
        echo `date`": took $duration seconds to replicate all DBs. Sleeping for $timeLeft seconds..."
      fi
      sleep $timeLeft
    fi

  else
    loop=false
  fi

done
