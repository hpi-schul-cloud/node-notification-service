cd ~/node-notification-service/
git pull
npm install
forever restart src/index.js
githash=$(git log --pretty=format:'%h' -n 1)
curl -X POST -d "{'attachments':[{'fallback':'New deploy live', 'pretext':'', 'color':'#009245', 'fields':[{'title':'New Deploy', 'value':'Commit #$githash is now live.', 'short':false } ] } ] } }" https://hooks.slack.com/services/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

