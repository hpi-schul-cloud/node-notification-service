cd ~/node-notification-service/
git pull
npm install
forever restart src/index.js
githash=$(git log --pretty=format:'%h' -n 1)
name=$(git --no-pager show -s --format='%an' $githash)
curl -X POST -d "{'attachments':[{'fallback':'New deploy live', 'pretext':'', 'color':'#009245', 'fields':[{'title':'New Deploy', 'value':'Commit <https://github.com/schulcloud/node-notification-service/commit/$githash|$githash> by $name is now live.', 'short':false } ] } ] } }" https://hooks.slack.com/services/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

