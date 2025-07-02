const mongoose = require('mongoose');
const Community = require('../models/Community');
require('dotenv').config();

const config = require('../config');

async function migrateCommunities() {
    try {
        await mongoose.connect(config.mongodbUri);
        console.log('Connected to MongoDB');

        // Find all communities that don't have the new fields
        const communities = await Community.find({
            $or: [
                { creator: { $exists: false } },
                { moderators: { $exists: false } },
                { members: { $exists: false } }
            ]
        });

        console.log(`Found ${communities.length} communities to migrate`);

        for (const community of communities) {
            // Set default values for new fields
            if (!community.creator) {
                community.creator = 'admin'; // Default creator, you may want to change this
            }
            
            if (!community.moderators) {
                community.moderators = [];
            }
            
            if (!community.members) {
                community.members = [community.creator];
            }

            await community.save();
            console.log(`Migrated community: ${community.name}`);
        }

        console.log('Migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected from MongoDB');
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateCommunities();
}

module.exports = migrateCommunities;