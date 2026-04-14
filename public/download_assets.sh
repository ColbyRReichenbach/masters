#!/bin/bash

# Augusta National Real Asset Downloader
# Fetches high-res layout photography for all 18 holes

mkdir -p public/layouts

echo "Fetching 18 Hole Layouts..."

for i in {1..18}
do
    echo "Downloading Hole $i..."
    curl -o "public/layout_${i}.jpg" "https://www.todays-golfer.com/wp-images/7512/1200x800/digital-hole-${i}-augusta-national.jpg"
done

echo ""
echo "Asset Acquisition Complete."
echo "Please ensure you have placed the following provided images in the public folder:"
echo "1. scoreboard.jpg (The scoreboard with Rory)"
echo "2. rory-profile.jpg (Rory in the Green Jacket)"
echo "3. hole12.jpg (Amen Corner real photo)"
