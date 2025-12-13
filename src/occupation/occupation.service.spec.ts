import { Test, TestingModule } from '@nestjs/testing';
import { OccupationService } from './occupation.service';
import { getModelToken } from '@nestjs/mongoose';
import { Occupation } from './occupation.schema';
import * as fs from 'fs';

// Mock the fs module
jest.mock('fs');
const mockedFs = fs as jest.Mocked<typeof fs>;

describe('OccupationService', () => {
  let service: OccupationService;
  let mockOccupationModel: { insertMany: jest.Mock };

  const mockJsonData = [
    {
      OCC_TITLE: 'Test Occupation 1',
      TOT_EMP: '1,000',
      A_MEAN: '50,000',
      A_PCT10: '20,000',
      A_PCT25: '30,000',
      A_MEDIAN: '45,000',
      A_PCT75: '60,000',
      A_PCT90: '80,000',
    },
    {
      OCC_TITLE: 'Test Occupation 2',
      TOT_EMP: '2,500',
      A_MEAN: '75,000',
      A_PCT10: '40,000',
      A_PCT25: '55,000',
      A_MEDIAN: '70,000',
      A_PCT75: '90,000',
      A_PCT90: '120,000',
    },
  ];

  beforeEach(async () => {
    mockOccupationModel = {
      insertMany: jest
        .fn()
        .mockResolvedValue([{ _id: 'some_id' }, { _id: 'some_other_id' }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccupationService,
        {
          provide: getModelToken(Occupation.name),
          useValue: mockOccupationModel,
        },
      ],
    }).compile();

    service = module.get<OccupationService>(OccupationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('importFromJson', () => {
    it('should import occupations from a JSON file', async () => {
      // Mock fs.readFileSync to return our mock JSON data as a string
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(mockJsonData));

      const result = await service.importFromJson();

      expect(result).toEqual({ inserted: 2 });
      expect(mockedFs.readFileSync).toHaveBeenCalledWith(
        expect.any(String),
        'utf-8',
      );

      const expectedFormattedData = [
        {
          OCC_TITLE: 'Test Occupation 1',
          TOT_EMP: 1000,
          A_MEAN: 50000,
          A_PCT10: 20000,
          A_PCT25: 30000,
          A_MEDIAN: 45000,
          A_PCT75: 60000,
          A_PCT90: 80000,
        },
        {
          OCC_TITLE: 'Test Occupation 2',
          TOT_EMP: 2500,
          A_MEAN: 75000,
          A_PCT10: 40000,
          A_PCT25: 55000,
          A_MEDIAN: 70000,
          A_PCT75: 90000,
          A_PCT90: 120000,
        },
      ];

      expect(mockOccupationModel.insertMany).toHaveBeenCalledWith(
        expectedFormattedData,
        { ordered: false },
      );
    });

    it('should handle null or empty values for numbers', async () => {
      const jsonDataWithNulls = [
        {
          OCC_TITLE: 'Test Occupation 3',
          TOT_EMP: null,
          A_MEAN: '',
          A_PCT10: undefined,
        },
      ];
      mockedFs.readFileSync.mockReturnValue(JSON.stringify(jsonDataWithNulls));
      mockOccupationModel.insertMany.mockResolvedValue([{ _id: 'some_id' }]);

      const result = await service.importFromJson();

      expect(result).toEqual({ inserted: 1 });
      expect(mockOccupationModel.insertMany).toHaveBeenCalledWith(
        [
          {
            OCC_TITLE: 'Test Occupation 3',
            TOT_EMP: null,
            A_MEAN: null,
            A_PCT10: null,
          },
        ],
        { ordered: false },
      );
    });
  });
});
