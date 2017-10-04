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

# When RUN_AT is specified, we need to sleep and then replicate
if [ "$RUN_AT" != "" ]; then
  skip=true
else
  skip=false
fi

if [ "$DEBUG" != "" ]; then
  DEBUG="-d"
fi

loop=true

while [ "$loop" = "true" ]; do

  before=`date +"%s"`

  if [ "$skip" = "false" ]; then
    /usr/local/bin/replicate-couchdb-cluster -s $SOURCE -t $TARGET $CONCURRENY $SKIP $USE_TARGET_API $VERBOSE $DEBUG
  fi

  after=`date +"%s"`

  if [ "$RUN_AT" != "" ]; then

    # Calculate the time until the next run

    day=`date +%Y-%m-%d`
    runAtSecs=`date --date="$day $RUN_AT" +"%s"`

    timeLeft=`expr $runAtSecs - $after`

    # Has the time for today already passed?
    if [ $timeLeft -lt 0 ]; then
      # Calculate the seconds until time tomorrow
      timeLeft=`expr $timeLeft + 86400`
    fi

    if [ "$VERBOSE" != "" ]; then
      echo `date`": sleeping until $RUN_AT ($timeLeft seconds)..."
    fi
    sleep $timeLeft

    skip=false

  elif [ "$continuous" == "1" ]; then

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
