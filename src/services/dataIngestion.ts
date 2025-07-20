import { apiService } from './api';
import { databaseService } from './database';
import { ProcurementRelease } from '../types/api';

export interface IngestionOptions {
  startDate: string;
  endDate: string;
  batchSize?: number;
  delayBetweenRequests?: number;
  maxRetries?: number;
}

export interface IngestionStats {
  totalProcessed: number;
  totalSuccessful: number;
  totalFailed: number;
  errors: Array<{ ocid: string; error: string }>;
  startTime: Date;
  endTime?: Date;
  duration?: number;
}

class DataIngestionService {
  private isRunning = false;
  private shouldStop = false;

  async ingestHistoricalData(options: IngestionOptions, onProgress?: (stats: IngestionStats) => void): Promise<IngestionStats> {
    if (this.isRunning) {
      throw new Error('Ingestion is already running');
    }

    this.isRunning = true;
    this.shouldStop = false;

    const stats: IngestionStats = {
      totalProcessed: 0,
      totalSuccessful: 0,
      totalFailed: 0,
      errors: [],
      startTime: new Date()
    };

    try {
      console.log('Starting historical data ingestion...', options);
      
      // Get date range for ingestion
      const startDate = new Date(options.startDate);
      const endDate = new Date(options.endDate);
      const batchSize = options.batchSize || 100;
      const delayBetweenRequests = options.delayBetweenRequests || 1000;

      // Calculate total days to process
      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      console.log(`Processing ${totalDays} days of data...`);

      // Process data in date ranges (weekly batches to avoid overwhelming the API)
      let currentDate = new Date(startDate);
      const weekInMs = 7 * 24 * 60 * 60 * 1000;

      while (currentDate <= endDate && !this.shouldStop) {
        const batchEndDate = new Date(Math.min(currentDate.getTime() + weekInMs, endDate.getTime()));
        
        console.log(`Processing batch: ${currentDate.toISOString().split('T')[0]} to ${batchEndDate.toISOString().split('T')[0]}`);
        
        try {
          // Fetch data for this date range
          const response = await apiService.getReleasesByDate({
            dateFrom: currentDate.toISOString().split('T')[0],
            dateTo: batchEndDate.toISOString().split('T')[0],
            page: 1
          });

          console.log(`Found ${response.releases.length} releases in this batch`);

          // Process each release
          for (const release of response.releases) {
            if (this.shouldStop) break;

            try {
              stats.totalProcessed++;
              
              // Store the release
              const storedRelease = await databaseService.storeProcurementRelease(release);
              
              if (storedRelease) {
                // Store related data
                if (release.parties && release.parties.length > 0) {
                  await databaseService.storeProcurementParties(storedRelease.id, release.parties);
                }
                
                if (release.tender?.documents && release.tender.documents.length > 0) {
                  await databaseService.storeProcurementDocuments(storedRelease.id, release.tender.documents);
                }
                
                stats.totalSuccessful++;
                console.log(`Successfully stored release: ${release.ocid}`);
              } else {
                stats.totalFailed++;
                stats.errors.push({
                  ocid: release.ocid || 'unknown',
                  error: 'Failed to store release in database'
                });
              }
              
              // Progress callback
              if (onProgress) {
                onProgress({ ...stats });
              }
              
            } catch (error) {
              console.error(`Error processing release ${release.ocid}:`, error);
              stats.totalFailed++;
              stats.errors.push({
                ocid: release.ocid || 'unknown',
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          }
          
          // Delay between API requests to be respectful
          if (delayBetweenRequests > 0) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
          }
          
        } catch (error) {
          console.error(`Error fetching data for batch ${currentDate.toISOString().split('T')[0]}:`, error);
          stats.errors.push({
            ocid: `batch-${currentDate.toISOString().split('T')[0]}`,
            error: error instanceof Error ? error.message : 'Unknown batch error'
          });
        }
        
        // Move to next batch
        currentDate = new Date(batchEndDate.getTime() + 1);
      }
      
    } catch (error) {
      console.error('Error during data ingestion:', error);
      throw error;
    } finally {
      stats.endTime = new Date();
      stats.duration = stats.endTime.getTime() - stats.startTime.getTime();
      this.isRunning = false;
      this.shouldStop = false;
      
      console.log('Data ingestion completed:', stats);
    }

    return stats;
  }

  async ingestSingleRelease(ocid: string): Promise<boolean> {
    try {
      console.log(`Ingesting single release: ${ocid}`);
      
      // Fetch detailed release data
      const release = await apiService.getReleaseDetails(ocid);
      
      // Store the release
      const storedRelease = await databaseService.storeProcurementRelease(release);
      
      if (storedRelease) {
        // Store related data
        if (release.parties && release.parties.length > 0) {
          await databaseService.storeProcurementParties(storedRelease.id, release.parties);
        }
        
        if (release.tender?.documents && release.tender.documents.length > 0) {
          await databaseService.storeProcurementDocuments(storedRelease.id, release.tender.documents);
        }
        
        console.log(`Successfully ingested release: ${ocid}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error ingesting release ${ocid}:`, error);
      return false;
    }
  }

  stopIngestion(): void {
    console.log('Stopping data ingestion...');
    this.shouldStop = true;
  }

  isIngestionRunning(): boolean {
    return this.isRunning;
  }

  // Get recent releases that might not be in database
  async syncRecentReleases(days: number = 7): Promise<IngestionStats> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days * 24 * 60 * 60 * 1000));
    
    return this.ingestHistoricalData({
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      batchSize: 50,
      delayBetweenRequests: 500
    });
  }

  // Generate analytics data from stored releases
  async generateAnalytics(): Promise<void> {
    try {
      console.log('Generating analytics data...');
      
      // This would generate vendor performance, pricing intelligence, etc.
      // Implementation would depend on the specific analytics requirements
      
      console.log('Analytics generation completed');
    } catch (error) {
      console.error('Error generating analytics:', error);
    }
  }
}

export const dataIngestionService = new DataIngestionService();