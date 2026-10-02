// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * PharmaTraceRegistry — EVM-compatible smart contract for
 * Blockchain-Based Pharmaceutical Drug Authentication and Supply Chain Tracking.
 *
 * Academic prototype for Ethereum Sepolia testnet.
 * DO NOT use on mainnet with real pharmaceutical data.
 *
 * Functions:
 *   registerBatch()       — Manufacturer registers a new batch
 *   getBatch()            — Read public batch data
 *   verifyBatch()         — Smart contract verification
 *   transferBatch()       — Transfer ownership
 *   recordSupplyChainEvent() — Record supply chain events
 *   getBatchHistory()     — Get supply chain events
 */

contract PharmaTraceRegistry {

    struct Batch {
        string batchId;
        string verificationId;
        string drugName;
        address manufacturer;
        uint256 manufacturingDate;
        uint256 expiryDate;
        address currentOwner;
        string currentLocation;
        string status;
        uint256 createdAt;
        bool exists;
    }

    struct SupplyChainEvent {
        string batchId;
        string eventType;
        address actor;
        string location;
        uint256 timestamp;
    }

    // Mapping from verificationId to Batch
    mapping(string => Batch) public batches;

    // Mapping from verificationId to supply chain events
    mapping(string => SupplyChainEvent[]) public batchHistory;

    // All registered verification IDs
    string[] public allVerificationIds;

    // Events
    event BatchRegistered(string verificationId, address manufacturer, uint256 timestamp);
    event BatchTransferred(string verificationId, address from, address to, uint256 timestamp);
    event SupplyChainEventRecorded(string verificationId, string eventType, address actor, uint256 timestamp);

    /**
     * Register a new pharmaceutical batch.
     * msg.sender becomes the manufacturer and initial owner.
     */
    function registerBatch(
        string memory _batchId,
        string memory _verificationId,
        string memory _drugName,
        uint256 _manufacturingDate,
        uint256 _expiryDate,
        string memory _currentLocation
    ) external {
        require(!batches[_verificationId].exists, "Batch already registered");
        require(bytes(_verificationId).length > 0, "Verification ID required");
        require(_expiryDate > _manufacturingDate, "Expiry must be after manufacturing");

        batches[_verificationId] = Batch({
            batchId: _batchId,
            verificationId: _verificationId,
            drugName: _drugName,
            manufacturer: msg.sender,
            manufacturingDate: _manufacturingDate,
            expiryDate: _expiryDate,
            currentOwner: msg.sender,
            currentLocation: _currentLocation,
            status: "REGISTERED",
            createdAt: block.timestamp,
            exists: true
        });

        allVerificationIds.push(_verificationId);

        // Record initial event
        batchHistory[_verificationId].push(SupplyChainEvent({
            batchId: _batchId,
            eventType: "BATCH_CREATED",
            actor: msg.sender,
            location: _currentLocation,
            timestamp: block.timestamp
        }));

        emit BatchRegistered(_verificationId, msg.sender, block.timestamp);
    }

    /**
     * Get batch information (read-only, no gas).
     */
    function getBatch(string memory _verificationId)
        external
        view
        returns (
            string memory batchId,
            string memory drugName,
            address manufacturer,
            address currentOwner,
            string memory status,
            uint256 createdAt,
            bool exists
        )
    {
        Batch storage b = batches[_verificationId];
        return (
            b.batchId,
            b.drugName,
            b.manufacturer,
            b.currentOwner,
            b.status,
            b.createdAt,
            b.exists
        );
    }

    /**
     * Verify a batch — checks existence, expiry, and ownership.
     * Returns: 0 = NOT_FOUND, 1 = VERIFIED, 2 = EXPIRED, 3 = MISMATCH
     */
    function verifyBatch(string memory _verificationId)
        external
        view
        returns (uint8)
    {
        Batch storage b = batches[_verificationId];
        if (!b.exists) return 0; // NOT_FOUND
        if (block.timestamp > b.expiryDate) return 2; // EXPIRED
        return 1; // VERIFIED
    }

    /**
     * Transfer batch ownership. Only the current owner can transfer.
     */
    function transferBatch(
        string memory _verificationId,
        address _newOwner,
        string memory _newLocation
    ) external {
        Batch storage b = batches[_verificationId];
        require(b.exists, "Batch not found");
        require(msg.sender == b.currentOwner, "Only current owner can transfer");
        require(_newOwner != address(0), "Invalid new owner");

        address previousOwner = b.currentOwner;
        b.currentOwner = _newOwner;
        b.currentLocation = _newLocation;
        b.status = "TRANSFERRED";

        batchHistory[_verificationId].push(SupplyChainEvent({
            batchId: b.batchId,
            eventType: "BATCH_TRANSFERRED",
            actor: msg.sender,
            location: _newLocation,
            timestamp: block.timestamp
        }));

        emit BatchTransferred(_verificationId, previousOwner, _newOwner, block.timestamp);
    }

    /**
     * Record a supply chain event (receive, verify, dispense, etc.)
     */
    function recordSupplyChainEvent(
        string memory _verificationId,
        string memory _eventType,
        string memory _location
    ) external {
        Batch storage b = batches[_verificationId];
        require(b.exists, "Batch not found");

        batchHistory[_verificationId].push(SupplyChainEvent({
            batchId: b.batchId,
            eventType: _eventType,
            actor: msg.sender,
            location: _location,
            timestamp: block.timestamp
        }));

        emit SupplyChainEventRecorded(_verificationId, _eventType, msg.sender, block.timestamp);
    }

    /**
     * Get supply chain event count for a batch.
     */
    function getBatchHistoryCount(string memory _verificationId)
        external
        view
        returns (uint256)
    {
        return batchHistory[_verificationId].length;
    }

    /**
     * Get a specific supply chain event.
     */
    function getBatchHistoryEvent(string memory _verificationId, uint256 _index)
        external
        view
        returns (
            string memory batchId,
            string memory eventType,
            address actor,
            string memory location,
            uint256 timestamp
        )
    {
        SupplyChainEvent storage e = batchHistory[_verificationId][_index];
        return (e.batchId, e.eventType, e.actor, e.location, e.timestamp);
    }

    /**
     * Get total number of registered batches.
     */
    function getTotalBatches() external view returns (uint256) {
        return allVerificationIds.length;
    }
}
