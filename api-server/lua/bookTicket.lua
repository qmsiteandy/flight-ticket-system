local item_key = KEYS[1]
local qty = tonumber(ARGV[1])

if not qty  or qty == 0 then
  return nil
end

-- Items in Sorted Set means available Seats
-- Check qty <= Set's length
local availableCount = redis.call("ZCARD", item_key);
if not availableCount or availableCount < qty then
    return nil
end

-- Pop the first n tickets
local val = redis.call("ZPOPMIN", item_key, qty)
return val