-- Additive indexes only. No existing data is deleted or moved.
create index api_keys_project_created_idx on nazu_cloud.api_keys(project_id,created_at desc);
create index wallet_challenges_project_issued_idx on nazu_cloud.wallet_challenges(project_id,issued_at);
create index wallet_sessions_project_expiry_idx on nazu_cloud.wallet_sessions(project_id,expires_at);
create index alert_rules_monitor_channel_idx on nazu_cloud.alert_rules(monitor_id,channel_id);
create index alert_deliveries_queue_idx on nazu_cloud.alert_deliveries(next_attempt_at) where status='pending';
create index alert_deliveries_channel_sent_idx on nazu_cloud.alert_deliveries(channel_id,delivered_at desc) where status='sent';
