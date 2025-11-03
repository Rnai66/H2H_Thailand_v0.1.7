route:
  group_by: ['alertname']
  group_wait: ${ALERT_GROUP_WAIT}
  group_interval: ${ALERT_GROUP_INTERVAL}
  repeat_interval: ${ALERT_REPEAT_INTERVAL}
  receiver: default-receiver
  routes:
    - matchers:
        - severity="critical"
      receiver: critical-receiver

receivers:
  - name: default-receiver
    email_configs:
      - to: "${ALERT_EMAIL_TO}"
        from: "${ALERT_EMAIL_FROM}"
        smarthost: "${ALERT_SMTP_HOST}"
        auth_username: "${ALERT_SMTP_USER}"
        auth_password: "${ALERT_SMTP_PASS}"
        require_tls: ${ALERT_EMAIL_TLS}

  - name: critical-receiver
    telegram_configs:
      - bot_token: "${TELEGRAM_BOT_TOKEN}"
        chat_id: ${TELEGRAM_CHAT_ID}
        parse_mode: "MarkdownV2"
        message: |
          *{{ .CommonLabels.alertname }}*  ({{ .Status }})
          Severity: {{ .CommonLabels.severity }}
          {{ range .Alerts -}}
          {{ .Annotations.summary }}
          {{ .Annotations.description }}
          {{ end }}
        disable_notifications: false
