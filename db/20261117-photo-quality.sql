-- Keep cache limits aligned with the higher-resolution SDR policy.
update storage.buckets set file_size_limit=1000000 where id='confort4-property-sdr';
