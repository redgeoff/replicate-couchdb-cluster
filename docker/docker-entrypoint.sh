#!/bin/bash

set -e

if [ "$1" = '/usr/local/bin/replicate-couchdb-cluster' ]; then

  # We have to nest our logic in another script so that docker doesn't exit prematurely. Docker
  # checks the command to see if it is still running and if our logic is in docker-entrypoint.sh, we
  # may sleeping or executing some other command.
  ./replicate.sh

else

  $@

fi
